import { z } from "zod";

export const contactSchema = z.object({
  body: z.object({
    name: z.string({ message: "Name is required" }).min(1, "Name cannot be empty"),
    email: z.string({ message: "Email is required" }).email("Invalid email format"),
    subject: z.string().optional(),
    message: z.string({ message: "Message is required" }).min(1, "Message cannot be empty"),
  }),
});

export const anonymousSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    message: z.string().optional(),
  }),
});

export const guestbookSchema = z.object({
  body: z.object({
    userName: z.string({ message: "userName is required" }).min(1, "userName cannot be empty"),
    userEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
    text: z.string({ message: "text is required" }).min(1, "text cannot be empty"),
  }),
});

export const trackVisitorSchema = z.object({
  body: z.object({
    screen: z.string().optional(),
    referrer: z.string().optional().or(z.literal("")),
    path: z.string({ message: "Path is required" }).min(1, "Path cannot be empty"),
  }),
});
