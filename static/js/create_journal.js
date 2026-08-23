// ======================================
// MemoryVerse Create Journal JS
// ======================================

// Current Category
let currentCategory = "animals";

// Sticker Cache
let stickerData = {};

// ----------------------------
// Open Popup
// ----------------------------

function openStickerPopup(){

    document.getElementById("stickerPopup").style.display="flex";

    loadCategory("animals");

}

// ----------------------------
// Close Popup
// ----------------------------

function closeStickerPopup(){

    document.getElementById("stickerPopup").style.display="none";

}

// ----------------------------
// Load JSON
// ----------------------------

async function loadCategory(category){

    currentCategory = category;

    const container = document.getElementById("stickerContainer");

    container.innerHTML = "<p>Loading...</p>";

    try{

        if(!stickerData[category]){

            const response = await fetch(
                `/static/data/${category}.json`
            );

            stickerData[category] = await response.json();

        }

        showStickers(stickerData[category]);

    }

    catch{

        container.innerHTML =
        "<p>Unable to load stickers.</p>";

    }

}

// ----------------------------
// Show Stickers
// ----------------------------

function showStickers(list){

    const container =
    document.getElementById("stickerContainer");

    container.innerHTML="";

    list.forEach(file=>{

        const img=document.createElement("img");

        img.src=
        `/static/images/stickers/${currentCategory}/${file}`;

        img.onclick=()=>selectSticker(img.src);

        container.appendChild(img);

    });

}

// ----------------------------
// Select Sticker
// ----------------------------

function selectSticker(path){

    document.getElementById("selectedSticker").innerHTML=

    `<img src="${path}" width="90">`;

    document.getElementById("stickerInput").value=path;

    closeStickerPopup();

}

// ----------------------------
// Search
// ----------------------------

document.addEventListener("DOMContentLoaded",()=>{

const search=document.getElementById("searchSticker");

if(search){

search.addEventListener("keyup",()=>{

const value=search.value.toLowerCase();

const filtered=stickerData[currentCategory].filter(name=>

name.toLowerCase().includes(value)

);

showStickers(filtered);

});

}

});

// ----------------------------
// Lock PIN
// ----------------------------

function showPinBox(){

const lock=document.getElementById("lockToggle");

const pin=document.getElementById("pinBox");

if(lock.checked){

pin.style.display="block";

}

else{

pin.style.display="none";

}

}

// ----------------------------
// Photo Preview
// ----------------------------

document.addEventListener("DOMContentLoaded",()=>{

const input=document.querySelector("input[type=file]");

const preview=document.getElementById("previewImages");

if(!input) return;

input.addEventListener("change",()=>{

preview.innerHTML="";

Array.from(input.files).forEach(file=>{

const reader=new FileReader();

reader.onload=e=>{

const img=document.createElement("img");

img.src=e.target.result;

preview.appendChild(img);

};

reader.readAsDataURL(file);

});

});

});