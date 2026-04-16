export interface MenuItem {
  id: string
  name: string
  description: string
  tags: string[]
}

export const mockMenu: MenuItem[] = [
  {
    id: 'classic-matcha-latte',
    name: 'Classic Matcha Latte',
    description: 'A smooth matcha latte with a classic creamy finish.',
    tags: ['The Classics', 'matcha'],
  },
  {
    id: 'classic-hojicha-latte',
    name: 'Classic Hojicha Latte',
    description: 'A roasted green tea latte with warm, toasty notes.',
    tags: ['The Classics', 'hojicha'],
  },
  {
    id: 'double-matcha-latte',
    name: 'Double Matcha Latte',
    description: 'A bolder matcha latte with an extra-rich tea flavor.',
    tags: ['The Classics', 'matcha'],
  },
  {
    id: 'double-hojicha-latte',
    name: 'Double Hojicha Latte',
    description: 'A deeper hojicha latte with extra roasted tea flavor.',
    tags: ['The Classics', 'hojicha'],
  },
  {
    id: 'jasmine-matcha-latte',
    name: 'Jasmine Matcha Latte',
    description: 'Matcha latte layered with a soft jasmine tea note.',
    tags: ['Floral & Tea Infusions', 'matcha'],
  },
  {
    id: 'jasmine-hojicha-latte',
    name: 'Jasmine Hojicha Latte',
    description: 'Roasted hojicha latte balanced with delicate jasmine tea.',
    tags: ['Floral & Tea Infusions', 'hojicha'],
  },
  {
    id: 'earl-grey-matcha-latte',
    name: 'Earl Grey Matcha Latte',
    description: 'Matcha latte with a fragrant Earl Grey tea infusion.',
    tags: ['Floral & Tea Infusions', 'matcha'],
  },
  {
    id: 'earl-grey-hojicha-latte',
    name: 'Earl Grey Hojicha Latte',
    description: 'Hojicha latte with cozy roasted tea and Earl Grey aroma.',
    tags: ['Floral & Tea Infusions', 'hojicha'],
  },
  {
    id: 'strawberry-matcha-latte',
    name: 'Strawberry Matcha Latte',
    description: 'Matcha latte paired with bright strawberry sweetness.',
    tags: ['Fruit Pairings', 'matcha'],
  },
  {
    id: 'strawberry-hojicha-latte',
    name: 'Strawberry Hojicha Latte',
    description: 'Roasted hojicha latte paired with strawberry sweetness.',
    tags: ['Fruit Pairings', 'hojicha'],
  },
  {
    id: 'blueberry-matcha-latte',
    name: 'Blueberry Matcha Latte',
    description: 'Matcha latte paired with juicy blueberry flavor.',
    tags: ['Fruit Pairings', 'matcha'],
  },
  {
    id: 'blueberry-hojicha-latte',
    name: 'Blueberry Hojicha Latte',
    description: 'Roasted hojicha latte paired with blueberry flavor.',
    tags: ['Fruit Pairings', 'hojicha'],
  },
  {
    id: 'coconut-matcha-cold-foam',
    name: 'Coconut Matcha Cold Foam',
    description: 'Matcha finished with a light coconut cold foam topping.',
    tags: ['Specialty Toppings', 'matcha'],
  },
  {
    id: 'coconut-hojicha-cold-foam',
    name: 'Coconut Hojicha Cold Foam',
    description: 'Hojicha finished with a light coconut cold foam topping.',
    tags: ['Specialty Toppings', 'hojicha'],
  },
]
