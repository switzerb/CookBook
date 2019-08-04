import React from 'react'
import { Container } from 'flux/utils'
import RecipesList from '../views/RecipesList'
import RecipeStore from '../data/RecipeStore'
import LibraryStore from '../data/LibraryStore'
import { humanStringComparator } from "../util/comparators"
import PreferencesStore from "../data/PreferencesStore"
import ListPreviewStore from "../data/ListPreviewStore"

export default Container.createFunctional(
    (props) => <RecipesList {...props}/>,
    () => [
        LibraryStore,
        PreferencesStore,
        ListPreviewStore,
        RecipeStore
    ],
    () => ({
        recipes: RecipeStore.getState(),
        libraryLO: LibraryStore.getLibraryLO()
            .map(rs => rs.sort(humanStringComparator)),
        stagedRecipes: LibraryStore.getStagedRecipes(
            PreferencesStore.getStagedRecipeIds()),
        shoppingList: ListPreviewStore.getPreview(),
    })
)