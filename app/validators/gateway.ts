import vine from '@vinejs/vine'

export const setPriority = vine.compile(
  vine.object({
    priority: vine.number().min(1),
  })
)

export const toggleActive = vine.compile(
  vine.object({
    isActive: vine.boolean(),
  })
)
