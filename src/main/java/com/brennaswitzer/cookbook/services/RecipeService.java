package com.brennaswitzer.cookbook.services;

import com.brennaswitzer.cookbook.domain.*;
import com.brennaswitzer.cookbook.payload.RawIngredientDissection;
import com.brennaswitzer.cookbook.repositories.PantryItemRepository;
import com.brennaswitzer.cookbook.repositories.RecipeRepository;
import com.brennaswitzer.cookbook.repositories.TaskRepository;
import com.brennaswitzer.cookbook.services.events.TaskCompletedEvent;
import com.brennaswitzer.cookbook.util.EnglishUtils;
import com.brennaswitzer.cookbook.util.NumberUtils;
import com.brennaswitzer.cookbook.util.UserPrincipalAccess;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RecipeService {

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private PantryItemRepository pantryItemRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTmpl;

    @Autowired
    private UserPrincipalAccess principalAccess;

    public Recipe saveOrUpdateRecipe(Recipe recipe) {
        recipe.setOwner(principalAccess.getUser());
        return recipeRepository.save(recipe);
    }

    public Optional<Recipe> findRecipeById(Long id) {
        return recipeRepository.findById(id);
    }

    public List<Recipe> findAllRecipes() {
        return recipeRepository.findByOwner(principalAccess.getUser());
    }

    public void deleteRecipeById(Long id) {
        recipeRepository.deleteById(id);
    }

    public void assembleShoppingList(
            AggregateIngredient agg,
            Task list,
            boolean withHeading
    ) {
        ShoppingList l = new ShoppingList();
        l.addAllPantryItems(agg);
        // todo: make this user specific
        l.resetItemOrder(new MagicalListItemStatsComparator(jdbcTmpl));
        entityManager.persist(l);
        if (withHeading) {
            l.createTasks(agg.getName(), list);
        } else {
            l.createTasks(list);
        }
        // also do any raw ingredients
        for (IngredientRef ref : agg.assembleRawIngredientRefs()) {
            String raw = ref.getRaw().trim();
            if (raw.isEmpty()) continue;
            list.addSubtask(new Task(raw));
        }
    }

    public void assembleShoppingList(Long recipeId, List<Long> additionalRecipeIds, Long listId, boolean withHeading) {
        Recipe r;
        if (additionalRecipeIds == null || additionalRecipeIds.isEmpty()) {
            // simple case - a single recipe
            r = recipeRepository.findById(recipeId).get();
        } else {
            // synthetic aggregate recipe
            r = new Recipe("Shopping List");
            r.addIngredient(recipeRepository.findById(recipeId).get());
            additionalRecipeIds.forEach(id ->
                    r.addIngredient(recipeRepository.findById(id).get()));
        }
        assembleShoppingList(r, taskRepository.getOne(listId), withHeading);
    }

    @EventListener
    public void taskCompleted(TaskCompletedEvent e) {
        System.out.println("YO! WOO! Task #" + e.getId() + " was completed!");
        entityManager.createQuery("select l\n" +
                "from ShoppingList l\n" +
                "    join l.items it\n" +
                "    join it.task t\n" +
                "where t.id = :taskId", ShoppingList.class)
        .setParameter("taskId", e.getId())
        .getResultList()
        .forEach(l -> {
            System.out.println("Yo! Woo! Shopping List #" + l.getId() + " had an item completed!");
            l.taskCompleted(e.getId());
        });
    }

    public void recordDissection(RawIngredientDissection dissection) {
        // fail fast on unparseable quantity
        String qText = dissection.getQuantityText();
        Double quantity = NumberUtils.parseNumber(qText);
        if (qText != null && quantity == null) {
            throw new RuntimeException("Quantity '" + quantity + "' cannot be parsed.");
        }

        // lets go!
        String name = dissection.getNameText();
        Ingredient ingredient = ensureIngredientByName(name);
        UnitOfMeasure uom = UnitOfMeasure.ensure(entityManager, dissection.getUnitsText());
        // update raw refs w/ dissected parts
        // this is a kludge to bulk update all equivalent refs. :)
        entityManager.flush();
        jdbcTmpl.update("update recipe_ingredients\n" +
                        "set quantity = ?,\n" +
                        "    units_id = ?,\n" +
                        "    ingredient_id = ?,\n" +
                        "    preparation = ?\n" +
                        "where raw = ?",
                quantity,
                uom == null ? null : uom.getId(),
                ingredient.getId(),
                dissection.getPrep(),
                dissection.getRaw());

    }

    private Ingredient ensureIngredientByName(String name) {
        String unpluralized = EnglishUtils.unpluralize(name);
        // see if there's a pantry item...
        Optional<PantryItem> pantryItem = pantryItemRepository.findOneByNameIgnoreCase(unpluralized);
        if (pantryItem.isPresent()) {
            return pantryItem.get();
        }
        // see if there's a recipe...
        Optional<Recipe> recipe = recipeRepository.findOneByOwnerAndNameIgnoreCase(principalAccess.getUser(), name);
        if (recipe.isPresent()) {
            return recipe.get();
        }
        recipe = recipeRepository.findOneByOwnerAndNameIgnoreCase(principalAccess.getUser(), unpluralized);
        if (recipe.isPresent()) {
            return recipe.get();
        }
        // make a new pantry item
        return pantryItemRepository.save(new PantryItem(unpluralized));
    }

}
