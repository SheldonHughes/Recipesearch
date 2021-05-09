import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';
/**Global stat of the app
 * -Search object
 * -Current recipe object
 * -Shopping list object
 * --Liked recipes
 */
const state = {};


/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
    //1 Get Query from view
    const query = searchView.getInput();
    //const query = 'pizza';
    //console.log(query)

    if (query) {
        // 2) New search object and add to state
        state.search = new Search(query);

        //3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
            //4) Search for recipes
            await state.search.getResults();

             //5)  Render result on UI
            clearLoader(elements.searchRes); 

            searchView.renderResults(state.search.result);
            
        } catch (error) {
            alert('The search was unable to complete..');
            clearLoader(elements.searchRes);
        }       
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if(btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    };

});

/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
    // Get Id from URl
    const id = window.location.hash.replace('#', '');
    
    if (id) {
        // Prepare Ui for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search item
       if (state.search) searchView.highlightSelected(id);
        //Create new recipe object
        state.recipe = new Recipe(id);

        //TESTING
        //window.r = state.recipe;

        try {
            //Get recipe data and parse ingredients;
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            //Render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id))
                
        } catch (error) {
            alert('Error processing recipe...')
        }
        
    };
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/**
 * LIST CONTROLLER
 */
 const controlList = () => {
    // Create a new list if there is none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItems(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    })
 };

 /**
 * LIKES CONTROLLER
 */
const controlLike = () => {
    if (!state.likes) state.likes = new Likes()
    const currentId = state.recipe.id;

    // User has Not yet liked current recipe
    if (!state.likes.isLiked(currentId)) {
        //Add like to the state
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img);
        //Toggle the like button
        likesView.toggleLikeBtn(true);

        //Add like to the UI list
        likesView.renderLike(newLike)
        
    // User has liked current recipe
    } else {
        //Remove like from the state
        state.likes.deleteLikes(currentId);
        //Toggle the like button
        likesView.toggleLikeBtn(false);
        //Remove like from the UI list
       likesView.deleteLike(currentId);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

//Restore liked recipes on load
window.addEventListener('load', () =>{
    state.likes = new Likes()
    //Read likes state
    state.likes.readStorage();
    //Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    //Render existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

 //Handle delete and update list item events
 elements.shopping.addEventListener('click', e => {
     const id = e.target.closest('.shopping__item').dataset.itemid;

     //Handle the delete button
     if (e.target.matches('.shopping__delete, .shopping__delete *')){
         //Delete from state
        state.list.deleteItem(id);
         //Delete from UI
         listView.deleteItem(id);
         // Handel the count update
     } else if (e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
     }
 });


// Handling button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease btn is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec')
            recipeView.updateServingsIngredients(state.recipe);
        }        
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase btn is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__button--add, .recipe__button--add *')) {
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }
});