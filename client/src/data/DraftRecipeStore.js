import { ReduceStore } from "flux/utils"
import Dispatcher from "./dispatcher"
import RecipeActions from "./RecipeActions"
import RouteActions from "./RouteActions"
import LibraryActions from "./LibraryActions"
import LibraryStore from "./LibraryStore"
import LoadObject from "../util/LoadObject"
import ClientId from "../util/ClientId"
import history from "../util/history"
import dotProp from "dot-prop-immutable"

const loadRecipeIfPossible = draftLO => {
    if (draftLO.isDone()) return draftLO
    const state = draftLO.getValueEnforcing()
    if (!state.id) return draftLO
    const lo = LibraryStore.getRecipeById(state.id)
    if (!lo.hasValue()) return draftLO
    const recipe = lo.getValueEnforcing()
    return draftLO.setValue({
        ...state,
        ...recipe,
    }).done().map(s => {
        if (s.ingredients == null || s.ingredients.length === 0) {
            s = {
                ...s,
                ingredients: [{raw: ""}]
            }
        }
        return s
    })
}

class DraftRecipeStore extends ReduceStore {
    
    constructor() {
        super(Dispatcher)
    }
    
    getInitialState() {
        return LoadObject.withValue({
            id: ClientId.next(),
            ingredients: [{raw: ""}]
        })
    }
    
    reduce(state, action) {
        
        switch (action.type) {

            case RouteActions.MATCH: {
                const match = action.match
                switch (match.path) {
                    case "/library/recipe/:id/edit": {
                        state = state.setValue({
                            id: parseInt(match.params.id),
                        }).loading()
                        return loadRecipeIfPossible(state)
                    }

                    case "/add": {
                        return this.getInitialState()
                    }

                    default:
                        return state
                }
            }

            case LibraryActions.INGREDIENT_LOADED:
            case LibraryActions.LIBRARY_LOADED: {
                Dispatcher.waitFor([
                    LibraryStore.getDispatchToken(),
                ])
                return loadRecipeIfPossible(state)
            }

            case RecipeActions.DRAFT_RECIPE_UPDATED: {
                let {key, value} = action.data
                state = state.map(s => dotProp.set(s, key, value))
                return state
            }

            case RecipeActions.NEW_DRAFT_INGREDIENT_YO: {
                return state.map(s => {
                    const ing = {
                        raw: "",
                    }
                    const ingredients = s.ingredients == null
                        ? []
                        : s.ingredients.slice(0)
                    const idx = action.hasOwnProperty("index")
                        ? action.index
                        : ingredients.length
                    if (idx < 0 || idx >= ingredients.length) {
                        ingredients.push(ing)
                    } else {
                        ingredients.splice(idx + 1, 0, ing)
                    }
                    return {
                        ...s,
                        ingredients,
                    }
                })
            }

            case RecipeActions.KILL_DRAFT_INGREDIENT_YO: {
                return state.map(s => {
                    if (s.ingredients == null) return s
                    const idx = action.index
                    if (idx == null || idx < 0) return s
                    if (idx >= s.ingredients.length) return s
                    const ingredients = s.ingredients.slice(0)
                    ingredients.splice(idx, 1)
                    return {
                        ...s,
                        ingredients,
                    }
                })
            }

            case RecipeActions.MULTI_LINE_DRAFT_INGREDIENT_PASTE_YO: {
                return state.map(s => {
                    const ingredients = s.ingredients == null
                        ? []
                        : s.ingredients.slice(0)
                    let idx = action.index < 0
                        ? 0
                        : action.index < ingredients.length
                            ? action.index
                            : ingredients.length - 1
                    if (ingredients[idx].raw.length === 0) {
                        // if pasting into an empty on, delete it
                        ingredients.splice(idx--, 1)
                    }
                    action.text
                        .split("\n")
                        .map(it => it.trim())
                        .filter(it => it.length > 0)
                        .forEach(raw =>
                            ingredients.splice(++idx, 0, {raw}))
                    return {
                        ...s,
                        ingredients,
                    }
                })
            }

            case RecipeActions.CREATE_RECIPE: {
                return state.creating()
            }

            case RecipeActions.UPDATE_RECIPE: {
                return state.updating()
            }

            case RecipeActions.RECIPE_CREATED: {
                return this.getInitialState()
            }

            case RecipeActions.CANCEL_ADD: {
                history.push("/library")
                return this.getInitialState()
            }

            case RecipeActions.CANCEL_EDIT: {
                history.push(`/library/recipe/${action.id}`)
                return this.getInitialState()
            }

            case RecipeActions.RECIPE_UPDATED: {
                return state.done()
            }

            default:
                return state
        }
    }

    getDraftLO() {
        return this.getState()
    }

    getDraft() {
        return this.getState().getValueEnforcing()
    }
    
}

export default new DraftRecipeStore()