export interface MenuItem {
  id: string
  name: string
  description: string
  price: number   // cents — e.g. 595 = $5.95 (avoids float arithmetic)
  tags: string[]
}

export const mockMenu: MenuItem[] = [
  {
    id: 'classic-latte',
    name: 'Classic Matcha Latte',
    description:
      'Ceremonial-grade matcha whisked smooth, topped with steamed oat milk and a delicate foam crown.',
    price: 595,
    tags: ['bestseller', 'dairy-free option'],
  },
  {
    id: 'iced-hojicha',
    name: 'Iced Hojicha Latte',
    description:
      'Roasted green tea with a toasty, caramel depth — poured over ice with your choice of milk.',
    price: 550,
    tags: ['iced', 'low-caffeine'],
  },
  {
    id: 'ceremonial-usucha',
    name: 'Ceremonial Usucha',
    description:
      'Pure matcha prepared in the traditional thin-style — nothing but water and stone-ground leaves.',
    price: 475,
    tags: ['traditional', 'vegan'],
  },
]
