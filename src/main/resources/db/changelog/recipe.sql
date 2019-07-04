--liquibase formatted sql

--changeset barneyb:add-raw-ingredients-to-recipe
alter table ingredient
    add raw_ingredients text;

update ingredient
set raw_ingredients = (
    select string_agg(
        coalesce(quantity, '')
            || ' '
            || (select name
                from ingredient
                where id = ri.ingredient_id)
            || coalesce(preparation, '')
        , chr(10) order by ingredient_id)
    from recipe_ingredients ri
    where recipe_id = ingredient.id
)
where dtype = 'Recipe';