// ======================================
// MemoryVerse - Create Scrapbook
// ======================================

let selectedBackground = "";

// ======================================
// Select Background
// ======================================

function selectBackground(img){

    // Remove previous selection
    document.querySelectorAll(".bg-thumb").forEach(item=>{
        item.classList.remove("selected");
    });

    // Add green border
    img.classList.add("selected");

    // Save relative path only
    selectedBackground =
        img.src.replace(window.location.origin, "");

    document.getElementById("backgroundInput").value =
        selectedBackground;

    console.log("Selected:", selectedBackground);

}

// ======================================
// Check before submit
// ======================================

document.addEventListener("DOMContentLoaded", function(){

    const form = document.querySelector("form");

    form.addEventListener("submit", function(e){

        if(selectedBackground === ""){

            alert("🌸 Please choose a background first.");

            e.preventDefault();

            return;

        }

    });

});