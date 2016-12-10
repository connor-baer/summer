/* jshint -W117 */
/* jshint -W098 */
/* jshint -W070 */

document.addEventListener('turbolinks:load', function () {

  // MOBILE SIDEBAR //

  var sidebarOpen = document.getElementById('js-sidebarOpen');
  var sidebarClose = document.getElementById('js-sidebarClose');
  var sidebar = document.getElementById('js-sidebar');

  sidebarOpen.addEventListener('click', function () {
    sidebar.classList.add('open');
  });

  sidebarClose.addEventListener('click', function () {
    sidebar.classList.remove('open');
  });
});
