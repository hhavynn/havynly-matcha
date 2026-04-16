export interface MenuItem {
  id: string
  name: string
  description: string
  tags: string[]
}

export const mockMenu: MenuItem[] = [
  {
    id: 'classic-latte',
    name: 'Classic Matcha Latte',
    description:
      'Ceremonial-grade matcha whisked smooth, topped with steamed oat milk and a delicate foam crown.',
    tags: ['bestseller', 'dairy-free option'],
  },
  {
    id: 'iced-hojicha',
    name: 'Iced Hojicha Latte',
    description:
      'Roasted green tea with a toasty, caramel depth poured over ice with your choice of milk.',
    tags: ['iced', 'low-caffeine'],
  },
  {
    id: 'ceremonial-usucha',
    name: 'Ceremonial Usucha',
    description:
      'Pure matcha prepared in the traditional thin style with nothing but water and stone-ground leaves.',
    tags: ['traditional', 'vegan'],
  },
]
