import { ItemInput } from '#types/item_input.type'

export type Payload = {
  client: {
    name: string
    email: string
  }
  items: ItemInput[]
  card: { number: string; cvv: string }
}
