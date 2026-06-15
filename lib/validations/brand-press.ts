import { z } from 'zod'

export const brandPressSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  contact_name: z.string().optional(),
  title: z.string().min(1, 'Post title is required'),
  excerpt: z.string().max(160).optional(),
  brand_name: z.string().min(1, 'Brand name is required'),
  content: z.string().min(1, 'Post body is required'),
  tier: z.enum(['basic', 'core', 'pro']),
  featured_image: z.string().optional(),
  scheduled_date: z.string().optional(),
  payment_method: z.enum(['card', 'transfer', 'invoice']),
  coupon_code: z.string().optional(),
  accepted_terms: z.boolean().refine((v) => v === true, {
    message: 'You must accept the Terms & Conditions',
  }),
})

export type BrandPressFormValues = z.infer<typeof brandPressSchema>
