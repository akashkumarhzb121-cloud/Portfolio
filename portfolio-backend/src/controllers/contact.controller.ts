import type { Request, Response, NextFunction } from 'express';
import { contactInputSchema } from '../schemas/contact.schema.js';
import { ContactEnquiry } from '../models/enquiry.model.js';
import { sendContactNotification } from '../services/email.service.js';

export async function submitContact(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validate incoming payload against schema
    const parseResult = contactInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your submission.',
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const validData = parseResult.data;

    // Save the enquiry before dispatching its email notification.
    let enquiry;
    try {
      enquiry = await ContactEnquiry.create({
        name: validData.name,
        email: validData.email,
        service: validData.service,
        message: validData.message
      });
    } catch (dbErr: unknown) {
      console.error('❌ Database save failure for contact enquiry:', dbErr);
      res.status(500).json({
        success: false,
        message: 'Database error: unable to save your enquiry. Please try again or email directly.'
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Message received successfully! I will reply shortly.'
    });

    void sendContactNotification(validData)
      .then((emailResult) => {
        if (!emailResult.success) {
          console.error(`⚠️ Email dispatch failed for enquiry ${enquiry._id}:`, {
            error: emailResult.error,
            errorCode: emailResult.errorCode
          });
        }
      })
      .catch((error: unknown) => {
        console.error(`⚠️ Email dispatch failed for enquiry ${enquiry._id}:`, error);
      });
  } catch (error) {
    next(error);
  }
}
