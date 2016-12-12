/* jshint -W117 */
/* jshint -W098 */
/* jshint -W070 */

document.addEventListener('turbolinks:load', function () {

  // LISTJS //

  // Define the list options.
  var searchOptions = {
    valueNames: [
      'title',
      'category',
      'tags',
      'duration',
      { name: 'ingredients', attr: 'data-ingredients' },
    ],
    plugins: [
      ListFuzzySearch(),
    ],
  };

  // Define the list object.
  recipeList = new List('js-list', searchOptions);

  // Get the search input element.
  var searchInput = document.getElementById('js-search');

  if (searchInput) {

    // Search when typing.
    searchInput.addEventListener('keyup', function functionName() {

      // Get the search value.
      var searchValue = searchInput.value;

      // Fuzzy search the list.
      recipeList.fuzzySearch.search(searchValue);
    });
  }

  var checkCategory = document.getElementsByClassName('js-category');
  var checkDuration = document.getElementsByClassName('js-duration');
  var checkMeat = document.getElementsByClassName('js-meat');
  var checkOrigin = document.getElementsByClassName('js-origin');

  var checkBoxes = document.getElementsByClassName('searchbar-checkbox');

  // Filter the list with the selected filters.
  function filterList() {
    var checkedCategory = [];
    var checkedDuration = [];
    var checkedMeat = [];
    var checkedOrigin = [];

    // Put the checked categories into an array.
    for (var m = 0; m < checkCategory.length; ++m) {
      if (checkCategory[m].checked) {
        var valueCategory = checkCategory[m].value;
        checkedCategory.push(valueCategory);
      }
    }

    // Put the checked durations into an array.
    for (var n = 0; n < checkDuration.length; ++n) {
      if (checkDuration[n].checked) {
        var valueDuration = checkDuration[n].value;
        checkedDuration.push(valueDuration);
      }
    }

    // Put the checked tags into an array.
    for (var o = 0; o < checkMeat.length; ++o) {
      if (checkMeat[o].checked) {
        var valueMeat = checkMeat[o].value;
        checkedMeat.push(valueMeat);
      }
    }

    // Put the checked tags into an array.
    for (var p = 0; p < checkOrigin.length; ++p) {
      if (checkOrigin[p].checked) {
        var valueOrigin = checkOrigin[p].value;
        checkedOrigin.push(valueOrigin);
      }
    }

    var checkedLength = checkedCategory.length + checkedDuration.length + checkedMeat.length + checkedOrigin.length;

    if (checkedLength > 0) {

      // Check if the item matches the filters.
      recipeList.filter(function (item) {

        // Check if in category.
        var category = checkedCategory.length === 0 || checkedCategory.indexOf(item.values().category) > -1;

        // Check if duration is shorter.
        var duration = checkedDuration.length === 0 || checkedDuration >= item.values().duration;

        // Check if item has meat.
        var meat = checkedMeat.length === 0 || checkedMeat.filter(function(n) { return item.values().tags.split(', ').indexOf(n) !== -1; }).length > 0 ;

        // Check where item originates.
        var origin = checkedOrigin.length === 0 || checkedOrigin.filter(function(n) { return item.values().tags.split(', ').indexOf(n) !== -1; }).length > 0 ;

        // Show the item if it matches the filters.
        if (category && duration && meat && origin) {
          return true;
        }
        return false;
      });
    } else {

      // No filters, so clear all filters.
      recipeList.filter();
    }
  }

  // Filter list when checkbox is clicked.
  if (checkBoxes) {
    for (var k = 0; k < checkBoxes.length; ++k) {
      checkBoxes[k].addEventListener('change', filterList);
    }
  }
});
