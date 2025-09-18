import vine from '@vinejs/vine'

export const checkout = vine.compile(
  vine.object({
    client: vine.object({
      name: vine.string().minLength(2),
      email: vine.string().email(),
    }),

    items: vine
      .array(
        vine.object({
          productId: vine.number(),
          quantity: vine.number().min(1),
        })
      )
      .minLength(1),

    card: vine.object({
      number: vine.string().minLength(12),
      cvv: vine.string().minLength(3).maxLength(4),
    }),
  })
)
