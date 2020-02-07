import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

//Global State of the App//
const state = {};
 
const controlSearch = async () => {
	//Get query from view
	const query = searchView.getInput();
	//console.log(query);

	if (query) {
		// New search object and add to state
		state.search = new Search(query);
		//Show a loading spinner
		searchView.clearInput();
		searchView.clearResults(); 
		renderLoader(elements.searchRes);

		try{
			//Search for recipes
			await state.search.getResults();

			//Render results on UI
			clearLoader();
			searchView.renderResults(state.search.result);
		}catch(err){
			alert('Something went wrong with the search');
			clearLoader();
		}
		
	}
}

elements.searchForm.addEventListener('submit', e => {
	e.preventDefault();
	controlSearch();
});


elements.searchResPages.addEventListener('click', e=>{
	const btn = e.target.closest('.btn-inline');
	if(btn) {
		const goToPage = parseInt(btn.dataset.goto, 10);
		searchView.clearResults();
		searchView.renderResults(state.search.result, goToPage);
	}
});


const controlRecipe = async () => {
	const id = window.location.hash.replace('#', '');

	if (id) {
		//Prepeare UI for changes
		recipeView.clearRecipe();
		renderLoader(elements.recipe);
		//Highlight the selected recipe
		if(state.search) searchView.highlightSelected(id);
		//Create new recipe object
		state.recipe = new Recipe(id);

		try{
			//Get recipe data
			await state.recipe.getRecipe();
			state.recipe.parseIngredients();
			//Calculate servings and time
			state.recipe.calcTime();
			state.recipe.calcServings();
			//Render recipe
			clearLoader();
			recipeView.renderRecipe(
				state.recipe,
				state.likes.isLiked(id)
			);
		}catch(err){
			console.log(err)
		}
	}
}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


const controlList = () => {
	//Create a new list if there is none
	if(!state.list) {
		state.list = new List();
	}
	//Add each ingredient to the list and UI
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});
};

elements.shopping.addEventListener('click', e=> {
	const id = e.target.closest('.shopping__item').dataset.itemid;

	if(e.target.matches('.shopping__delete, .shopping__delete *')) {
		state.list.deleteItem(id);
		listView.deleteItem(id);
	}else if(e.target.matches('.shopping__count-value')) {
		const val = parseFloat(e.target.value, 10);
		state.list.updateCount(id, val);
	}
})

state.likes = new Likes();
likesView.toggleLikeMenu(state.likes.getNumLikes());//testing
const controlLike = () => {
	if(!state.likes) state.likes = new Likes();
	const currentID = state.recipe.id;

	if(!state.likes.isLiked(currentID)) {
		const newLike = state.likes.addLike(
			currentID,
			state.recipe.title,
			state.recipe.author,
			state.recipe.img
		);
		likesView.toggleLikeBtn(true);
		likesView.renderLike(newLike);
	} else {
		state.likes.deleteLike(currentID);
		likesView.toggleLikeBtn(false);
		likesView.deleteLike(currentID);
	}
	likesView.toggleLikeMenu(state.likes.getNumLikes());
}


window.addEventListener('load', () => {
	state.likes = new Likes();
	state.likes.readStorage();
	likesView.toggleLikeMenu(state.likes.getNumLikes());
	state.likes.likes.forEach(like => likesView.renderLike(like));
});


//Handling recipe button change
elements.recipe.addEventListener('click', e =>{
	if(e.target.matches('.btn-decrease, .btn-decrease *')) {
		//Decrease button is clicked
		if(state.recipe.servings > 1) {
			state.recipe.updateServings('dec');
			recipeView.updateServingsIngredients(state.recipe);
		}
	} else if (e.target.matches('.btn-increase, .btn-increase *')) {
		//Increase button is clicked
		state.recipe.updateServings('inc');
		recipeView.updateServingsIngredients(state.recipe);
	} else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
		controlList();
	}else if (e.target.matches('.recipe__love, .recipe__love *')) {
		controlLike();
	}
});

