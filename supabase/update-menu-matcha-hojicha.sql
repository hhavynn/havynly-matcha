-- Update the live menu to the Matcha & Hojicha Beverage Menu.
-- Safe for existing order history:
-- - Existing menu rows with matching names are updated.
-- - Missing menu rows are inserted.
-- - Other existing menu rows are marked unavailable instead of deleted, so old orders keep their references.

do $$
declare
  item record;
  target_names text[] := array[
    'Classic Matcha Latte',
    'Classic Hojicha Latte',
    'Double Matcha Latte',
    'Double Hojicha Latte',
    'Jasmine Matcha Latte',
    'Jasmine Hojicha Latte',
    'Earl Grey Matcha Latte',
    'Earl Grey Hojicha Latte',
    'Strawberry Matcha Latte',
    'Strawberry Hojicha Latte',
    'Blueberry Matcha Latte',
    'Blueberry Hojicha Latte',
    'Coconut Matcha Cold Foam',
    'Coconut Hojicha Cold Foam'
  ];
begin
  for item in
    select *
    from (values
      ('Classic Matcha Latte', 'A smooth matcha latte with a classic creamy finish.', array['The Classics', 'matcha']::text[], 1),
      ('Classic Hojicha Latte', 'A roasted green tea latte with warm, toasty notes.', array['The Classics', 'hojicha']::text[], 2),
      ('Double Matcha Latte', 'A bolder matcha latte with an extra-rich tea flavor.', array['The Classics', 'matcha']::text[], 3),
      ('Double Hojicha Latte', 'A deeper hojicha latte with extra roasted tea flavor.', array['The Classics', 'hojicha']::text[], 4),
      ('Jasmine Matcha Latte', 'Matcha latte layered with a soft jasmine tea note.', array['Floral & Tea Infusions', 'matcha']::text[], 5),
      ('Jasmine Hojicha Latte', 'Roasted hojicha latte balanced with delicate jasmine tea.', array['Floral & Tea Infusions', 'hojicha']::text[], 6),
      ('Earl Grey Matcha Latte', 'Matcha latte with a fragrant Earl Grey tea infusion.', array['Floral & Tea Infusions', 'matcha']::text[], 7),
      ('Earl Grey Hojicha Latte', 'Hojicha latte with cozy roasted tea and Earl Grey aroma.', array['Floral & Tea Infusions', 'hojicha']::text[], 8),
      ('Strawberry Matcha Latte', 'Matcha latte paired with bright strawberry sweetness.', array['Fruit Pairings', 'matcha']::text[], 9),
      ('Strawberry Hojicha Latte', 'Roasted hojicha latte paired with strawberry sweetness.', array['Fruit Pairings', 'hojicha']::text[], 10),
      ('Blueberry Matcha Latte', 'Matcha latte paired with juicy blueberry flavor.', array['Fruit Pairings', 'matcha']::text[], 11),
      ('Blueberry Hojicha Latte', 'Roasted hojicha latte paired with blueberry flavor.', array['Fruit Pairings', 'hojicha']::text[], 12),
      ('Coconut Matcha Cold Foam', 'Matcha finished with a light coconut cold foam topping.', array['Specialty Toppings', 'matcha']::text[], 13),
      ('Coconut Hojicha Cold Foam', 'Hojicha finished with a light coconut cold foam topping.', array['Specialty Toppings', 'hojicha']::text[], 14)
    ) as menu(name, description, tags, sort_order)
  loop
    if exists (select 1 from public.menu_items where menu_items.name = item.name) then
      update public.menu_items
      set
        description = item.description,
        price_cents = 0,
        tags = item.tags,
        is_available = true,
        sort_order = item.sort_order
      where menu_items.name = item.name;
    else
      insert into public.menu_items (
        name,
        description,
        price_cents,
        tags,
        is_available,
        sort_order
      )
      values (
        item.name,
        item.description,
        0,
        item.tags,
        true,
        item.sort_order
      );
    end if;
  end loop;

  update public.menu_items
  set is_available = false
  where name <> all(target_names);
end $$;
