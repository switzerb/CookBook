import React from 'react';
import {Button} from "antd";
import IngredientItem from "./IngredientItem";

const RecipeDetail = ({recipe, onDelete, onSelect}) => {
  return (
    <div>
      <p onClick={() => onSelect(null)}>X Close</p>
      <h3>{recipe.get('title')}</h3>
      <h5>Source</h5>
      <p>{recipe.get('external_url')}</p>
      
      <h5>Ingredients</h5>
      <div>{recipe.get('ingredients').map(ingredient => {
        return (
          <IngredientItem key={ingredient.id} ingredient={ingredient} />
        )
      })}</div>
      
      <h5>Preparation</h5>
      <p>{recipe.get('directions')}</p>
      
      <Button type="danger" onClick={() => onDelete(recipe.get('id'))}>Delete Recipe</Button>
    </div>
  )
};

export default RecipeDetail;