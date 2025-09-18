import vine from '@vinejs/vine'

export const createProduct = vine.compile(
  vine.object({
    name: vine.string().trim(),
    amount: vine.number().min(0),
  })
)
