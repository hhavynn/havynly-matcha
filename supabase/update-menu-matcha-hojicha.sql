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
    'Earl Grey Matcha Latte',
    'Earl Grey Hojicha Latte',
    'Strawberry Matcha Latte',
    'Strawberry Hojicha Latte',
    'Blueberry Matcha Latte',
    'Blueberry Hojicha Latte',
    'Coconut Matcha Cold Foam'
  ];
begin
  for item in
    select *
    from (values
      ('Classic Matcha Latte', 'default ahh matcha.', array['The Classics', 'matcha']::text[], 1),
      ('Classic Hojicha Latte', 'default ahh hojicha.', array['The Classics', 'hojicha']::text[], 2),
      ('Double Matcha Latte', 'double ahh matcha.', array['The Classics', 'matcha']::text[], 3),
      ('Double Hojicha Latte', 'double ahh hojicha.', array['The Classics', 'hojicha']::text[], 4),
      ('Jasmine Matcha Latte', 'molly tea dupe ahh matcha', array['Floral & Tea Infusions', 'matcha']::text[], 5),
      ('Earl Grey Matcha Latte', 'still perfecting this one icl...', array['Floral & Tea Infusions', 'matcha']::text[], 7),
      ('Earl Grey Hojicha Latte', 'still perfecting this one icl...', array['Floral & Tea Infusions', 'hojicha']::text[], 8),
      ('Strawberry Matcha Latte', 'big fat ahh strawberries', array['Fruit Pairings', 'matcha']::text[], 9),
      ('Strawberry Hojicha Latte', 'big fat ahh strawberries', array['Fruit Pairings', 'hojicha']::text[], 10),
      ('Blueberry Matcha Latte', 'yet to try this one myself icl', array['Fruit Pairings', 'matcha']::text[], 11),
      ('Blueberry Hojicha Latte', 'yet to try this one myself icl', array['Fruit Pairings', 'hojicha']::text[], 12),
      ('Coconut Matcha Cold Foam', 'this ones my favoritee', array['Specialty Toppings', 'matcha']::text[], 13)
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
