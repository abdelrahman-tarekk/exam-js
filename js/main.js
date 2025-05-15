$(document).ready(function() {
    const API_BASE_URL = "https://www.themealdb.com/api/json/v1/1/";
    const MEALS_GRID = $("#mealsGrid");
    const NAV_MENU = $(".nav-menu");
    const TOGGLE_ICON_ELEMENT = $(".control-panel .toggle-icon");
    const TOGGLE_ICON_CONTAINER = $(".control-panel .toggle-icon-container");
    const NAV_LINKS_ITEMS = $(".nav-menu .nav-links li");
    const NAV_LINKS_ANCHORS = $(".nav-menu .nav-links a");
    const LOGO_IMG_PATH = "images/logo.png"; 

    // --- Sidebar Toggle --- 
    function openNavMenu() {
        NAV_MENU.addClass("open");
        TOGGLE_ICON_ELEMENT.removeClass("fa-bars").addClass("fa-times");
        animateNavLinks(true);
    }

    function closeNavMenu() {
        NAV_MENU.removeClass("open");
        TOGGLE_ICON_ELEMENT.removeClass("fa-times").addClass("fa-bars");
        animateNavLinks(false);
    }

    TOGGLE_ICON_CONTAINER.click(function() { 
        if (NAV_MENU.hasClass("open")) {
            closeNavMenu();
        } else {
            openNavMenu();
        }
    });

    function animateNavLinks(open) {
        if (open) {
            NAV_LINKS_ITEMS.each(function(index) {
                $(this).css({
                    "opacity": "0",
                    "padding-top": "25px" 
                }).delay(index * 100).animate({
                    "opacity": "1",
                    "padding-top": "0.8rem"
                }, 300);
            });
        } else {
            NAV_LINKS_ITEMS.css({
                "opacity": "0",
                "padding-top": "25px"
            });
        }
    }

    // --- Loading Spinner ---
    function showLoading() {
        $("body").append("<div class=\"loading-spinner\"><div class=\"spinner\"></div></div>");
    }

    function hideLoading() {
        $(".loading-spinner").remove();
    }

    // --- Generic API Data Fetching --- 
    async function fetchAPIData(endpoint, queryParam = "") {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}${queryParam}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (endpoint === "categories.php") {
                return data.categories; 
            } else {
                return data.meals;
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            MEALS_GRID.html("<p class=\"text-danger text-center col-12\">Failed to load data. Please try again later.</p>");
            return null;
        } finally {
            hideLoading();
        }
    }

    function displayMeals(meals) {
        MEALS_GRID.empty().addClass("row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4");
        if (!meals) {
            MEALS_GRID.html("<p class=\"text-center col-12\">No meals found.</p>");
            return;
        }
        meals.forEach(meal => {
            const mealItem = `
                <div class="col">
                    <div class="meal-item" data-id="${meal.idMeal}">
                        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="img-fluid">
                        <div class="meal-overlay">
                            <h3>${meal.strMeal}</h3>
                        </div>
                    </div>
                </div>
            `;
            MEALS_GRID.append(mealItem);
        });

        $(".meal-item").click(function() {
            const mealId = $(this).data("id");
            fetchAndDisplayMealDetails(mealId);
        });
    }

    // --- Fetch and Display Meal Details ---
    async function fetchAndDisplayMealDetails(mealId) {
        const meals = await fetchAPIData("lookup.php?i=", mealId);
        if (meals && meals.length > 0) {
            displayMealDetails(meals[0]);
        }
    }

    function displayMealDetails(meal) {
        MEALS_GRID.empty().removeClass("row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4");
        let ingredientsList = "";
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`]) {
                ingredientsList += `<li class="alert alert-info m-2 p-1">${meal[`strMeasure${i}`]} ${meal[`strIngredient${i}`]}</li>`;
            } else {
                break;
            }
        }

        let tagsHtml = "";
        if (meal.strTags) {
            const tagsArray = meal.strTags.split(",");
            tagsArray.forEach(tag => {
                tagsHtml += `<span class="alert alert-danger m-2 p-1">${tag.trim()}</span>`;
            });
        }

        const detailsHtml = `
            <div class="col-12 meal-details-content text-white">
                <div class="row">
                    <div class="col-md-4 text-center">
                        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="img-fluid rounded mb-3">
                        <h2>${meal.strMeal}</h2>
                    </div>
                    <div class="col-md-8">
                        <h3>Instructions</h3>
                        <p class="instructions">${meal.strInstructions}</p>
                        <h3>Area: <span class="fw-normal">${meal.strArea}</span></h3>
                        <h3>Category: <span class="fw-normal">${meal.strCategory}</span></h3>
                        <h3>Recipes:</h3>
                        <ul class="list-unstyled d-flex flex-wrap">
                            ${ingredientsList}
                        </ul>
                        <h3>Tags:</h3>
                        <div class="tags d-flex flex-wrap">
                            ${tagsHtml}
                        </div>
                        <a href="${meal.strSource || "#"}" target="_blank" class="btn btn-success me-2 mt-3 btn-source ${meal.strSource ? "" : "disabled"}">Source</a>
                        <a href="${meal.strYoutube || "#"}" target="_blank" class="btn btn-danger mt-3 btn-youtube ${meal.strYoutube ? "" : "disabled"}">YouTube</a>
                    </div>
                </div>
            </div>
        `;
        MEALS_GRID.html(detailsHtml);
        closeNavMenu(); 
    }

    // --- Navigation Handling ---
    NAV_LINKS_ANCHORS.click(function(e) {
        e.preventDefault();
        const targetSection = $(this).attr("href");
        
        MEALS_GRID.empty().removeClass("row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4");
        $(".search-container, .categories-container, .area-container, .ingredients-container, .contact-container").remove();

        if (targetSection === "#search") {
            displaySearchForm();
        } else if (targetSection === "#categories") {
            fetchAndDisplayCategories();
        } else if (targetSection === "#area") {
            fetchAndDisplayAreas();
        } else if (targetSection === "#ingredients") {
            fetchAndDisplayIngredients();
        } else if (targetSection === "#contact") {
            displayContactForm();
        }
        closeNavMenu();
    });

    function displaySearchForm() {
        const searchHtml = `
            <div class="col-12 search-container">
                <div class="row g-3">
                    <div class="col-md-6">
                        <input type="text" id="searchByName" class="form-control" placeholder="Search By Name">
                    </div>
                    <div class="col-md-6">
                        <input type="text" id="searchByFirstLetter" class="form-control" placeholder="Search By First Letter (single character)" maxlength="1">
                    </div>
                </div>
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 mt-4" id="searchResultsGrid"></div>
            </div>
        `;
        MEALS_GRID.html(searchHtml);
        $("#searchByName").on("keyup", function() {
            const query = $(this).val();
            if (query.length > 0) fetchAPIData("search.php?s=", query).then(meals => displayMealsInSubGrid(meals, "#searchResultsGrid"));
            else $("#searchResultsGrid").empty();
        });
        $("#searchByFirstLetter").on("keyup", function() {
            const query = $(this).val();
            if (query.length === 1) fetchAPIData("search.php?f=", query).then(meals => displayMealsInSubGrid(meals, "#searchResultsGrid"));
            else $("#searchResultsGrid").empty();
        });
    }

    function displayMealsInSubGrid(meals, gridSelector) {
        const subGrid = $(gridSelector);
        subGrid.empty();
        if (!meals) {
            subGrid.html("<p class=\"text-center col-12\">No meals found.</p>");
            return;
        }
        meals.forEach(meal => {
            const mealItem = `
                <div class="col">
                    <div class="meal-item" data-id="${meal.idMeal}">
                        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="img-fluid">
                        <div class="meal-overlay">
                            <h3>${meal.strMeal}</h3>
                        </div>
                    </div>
                </div>
            `;
            subGrid.append(mealItem);
        });
        $(gridSelector + " .meal-item").click(function() {
            const mealId = $(this).data("id");
            fetchAndDisplayMealDetails(mealId);
        });
    }

    async function fetchAndDisplayCategories() {
        const categoriesData = await fetchAPIData("categories.php"); 
        if (categoriesData) {
            let categoriesHtml = "<div class=\"col-12 categories-container\"><div class=\"row g-4\">";
            categoriesData.forEach(category => {
                categoriesHtml += `
                    <div class="col-md-6 col-lg-3">
                        <div class="category-item text-center p-3 rounded" data-category="${category.strCategory}">
                            <img src="${category.strCategoryThumb}" alt="${category.strCategory}" class="img-fluid mb-2">
                            <h4>${category.strCategory}</h4>
                            <p class=\"small\">${category.strCategoryDescription ? category.strCategoryDescription.substring(0, 70) + "..." : ""}</p>
                        </div>
                    </div>
                `;
            });
            categoriesHtml += "</div></div>";
            MEALS_GRID.html(categoriesHtml);
            $(".category-item").click(function() {
                const categoryName = $(this).data("category");
                fetchAPIData("filter.php?c=", categoryName).then(displayMeals);
            });
        }
    }

    async function fetchAndDisplayAreas() {
        const areas = await fetchAPIData("list.php?a=list");
        if (areas) {
            let areasHtml = "<div class=\"col-12 area-container\"><div class=\"row g-4\">";
            areas.forEach(area => {
                areasHtml += `
                    <div class="col-md-6 col-lg-3">
                        <div class="area-item text-center p-3 rounded" data-area="${area.strArea}">
                            <i class="fas fa-map-marker-alt fa-3x mb-2"></i>
                            <h4>${area.strArea}</h4>
                        </div>
                    </div>
                `;
            });
            areasHtml += "</div></div>";
            MEALS_GRID.html(areasHtml);
            $(".area-item").click(function() {
                const areaName = $(this).data("area");
                fetchAPIData("filter.php?a=", areaName).then(displayMeals);
            });
        }
    }

    async function fetchAndDisplayIngredients() {
        const ingredientsData = await fetchAPIData("list.php?i=list"); 
        if (ingredientsData) {
            let ingredientsHtml = "<div class=\"col-12 ingredients-container\"><div class=\"row g-4\">";
            ingredientsData.slice(0, 20).forEach(ingredient => {
                ingredientsHtml += `
                    <div class="col-md-6 col-lg-3">
                        <div class="ingredient-item text-center p-3 rounded" data-ingredient="${ingredient.strIngredient}">
                            <i class="fas fa-drumstick-bite fa-3x mb-2"></i> 
                            <h4>${ingredient.strIngredient}</h4>
                            <p class=\"small\">${ingredient.strDescription ? ingredient.strDescription.substring(0, 100) + "..." : "Select to see meals."}</p>
                        </div>
                    </div>
                `;
            });
            ingredientsHtml += "</div></div>";
            MEALS_GRID.html(ingredientsHtml);
            $(".ingredient-item").click(function() {
                const ingredientName = $(this).data("ingredient");
                fetchAPIData("filter.php?i=", ingredientName).then(displayMeals);
            });
        }
    }

    function displayContactForm() {
        const contactHtml = `
        <div class="contact-container min-vh-100 d-flex justify-content-center align-items-center">
            <div class="container">
                <div class="row g-4 text-center">
                    <h2 class="text-white mb-4">Contact Us</h2>
                    <div class="col-md-6">
                        <input id="contactName" type="text" class="form-control" placeholder="Enter Your Name">
                        <div class="alert alert-danger mt-2 py-1 d-none" id="nameAlert">Special characters and numbers not allowed</div>
                    </div>
                    <div class="col-md-6">
                        <input id="contactEmail" type="email" class="form-control" placeholder="Enter Your Email">
                        <div class="alert alert-danger mt-2 py-1 d-none" id="emailAlert">Email not valid *exemple@yyy.zzz</div>
                    </div>
                    <div class="col-md-6">
                        <input id="contactPhone" type="text" class="form-control" placeholder="Enter Your Phone">
                        <div class="alert alert-danger mt-2 py-1 d-none" id="phoneAlert">Enter valid Phone Number</div>
                    </div>
                    <div class="col-md-6">
                        <input id="contactAge" type="number" class="form-control" placeholder="Enter Your Age">
                        <div class="alert alert-danger mt-2 py-1 d-none" id="ageAlert">Enter valid age (1-119)</div>
                    </div>
                    <div class="col-md-6">
                        <input id="contactPassword" type="password" class="form-control" placeholder="Enter Your Password">
                        <div class="alert alert-danger mt-2 py-1 d-none" id="passwordAlert">Min 8 chars, 1 letter, 1 num</div>
                    </div>
                    <div class="col-md-6">
                        <input id="contactRepassword" type="password" class="form-control" placeholder="Repassword">
                        <div class="alert alert-danger mt-2 py-1 d-none" id="repasswordAlert">Passwords do not match</div>
                    </div>
                </div>
                <button id="submitBtn" class="btn btn-outline-danger px-3 mt-4" disabled>Submit</button>
            </div>
        </div>`;
        MEALS_GRID.html(contactHtml);
        addContactFormValidation();
    }

    function addContactFormValidation() {
        let validations = {
            name: false, email: false, phone: false, age: false, password: false, repassword: false
        };

        const regexPatterns = {
            name: /^[a-zA-Z\s]+$/,
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\+?[0-9]{10,15}$/,
            age: /^(?:[1-9]|[1-9][0-9]|1[01][0-9])$/,
            password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
        };

        function validateField(inputId, alertId, fieldName, regex, customValidation) {
            const value = $(inputId).val();
            let isValid = customValidation ? customValidation(value) : (regex ? regex.test(value) : false);
            
            if (isValid) {
                $(alertId).addClass("d-none");
                validations[fieldName] = true;
            } else {
                $(alertId).removeClass("d-none");
                validations[fieldName] = false;
            }
            checkFormValidity();
        }

        function checkFormValidity() {
            const allValid = Object.values(validations).every(status => status === true);
            $("#submitBtn").prop("disabled", !allValid);
        }

        $("#contactName").on("keyup", () => validateField("#contactName", "#nameAlert", "name", regexPatterns.name));
        $("#contactEmail").on("keyup", () => validateField("#contactEmail", "#emailAlert", "email", regexPatterns.email));
        $("#contactPhone").on("keyup", () => validateField("#contactPhone", "#phoneAlert", "phone", regexPatterns.phone));
        $("#contactAge").on("keyup", () => validateField("#contactAge", "#ageAlert", "age", regexPatterns.age));
        $("#contactPassword").on("keyup", () => {
            validateField("#contactPassword", "#passwordAlert", "password", regexPatterns.password);
            validateField("#contactRepassword", "#repasswordAlert", "repassword", null, (val) => val === $("#contactPassword").val() && $("#contactPassword").val().length > 0 && regexPatterns.password.test($("#contactPassword").val()));
        });
        $("#contactRepassword").on("keyup", () => validateField("#contactRepassword", "#repasswordAlert", "repassword", null, (val) => val === $("#contactPassword").val() && val !== ""));
    
        checkFormValidity();
    }

    // --- Initial Load --- 
    fetchAPIData("search.php?s=", "").then(meals => {
        if (meals && meals.length > 0) {
            displayMeals(meals);
        } else {
            fetchAPIData("search.php?f=", "a").then(displayMeals);
        }
    });
    if (NAV_MENU.hasClass("open")) {
        animateNavLinks(true);
    } else {
        animateNavLinks(false);
    }
});

//////////////////////////////////////////////////////////THE END/////////////////////////////////////////////////////