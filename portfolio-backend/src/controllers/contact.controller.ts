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

    // Save the enquiry before sending so it remains available if SMTP delivery fails.
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

    const emailResult = await sendContactNotification(validData);

    if (!emailResult.success) {
      console.error(`⚠️ Email dispatch failed for enquiry ${enquiry._id}:`, emailResult.error);

      res.status(502).json({
        success: false,
        message: 'Your enquiry was recorded in the database, but email notification delivery failed. Please reach out directly if urgent.',
        enquiryId: enquiry._id,
        deliveryCode: emailResult.errorCode
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Message delivered successfully! I will reply shortly.'
    });
  } catch (error) {
    next(error);
  }
}
