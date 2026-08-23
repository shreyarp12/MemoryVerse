/* ==========================================================
      MemoryVerse Scrapbook Editor
      FINAL VERSION
========================================================== */

/* ==========================================================
      Elements
========================================================== */

const canvas=document.getElementById("canvas");

const panel=document.getElementById("bottomPanel");

const assetContainer=document.getElementById("assetContainer");

const panelTitle=document.getElementById("panelTitle");

const photoPicker=document.getElementById("photoPicker");

const saveButton=document.getElementById("saveScrapbook");

/* ==========================================================
      Variables
========================================================== */

let selectedBox=null;

let highestZ=10;

/* ==========================================================
      Panel
========================================================== */

function openPanel(name){

    panel.classList.add("active");

    panelTitle.innerHTML=name;

    assetContainer.innerHTML="";

}

function closePanel(){

    panel.classList.remove("active");

}

/* ==========================================================
      Placeholder
========================================================== */

function removePlaceholder(){

    const p=document.querySelector(".canvas-placeholder");

    if(p){

        p.remove();

    }

}

/* ==========================================================
      Backgrounds
========================================================== */

function openBackgrounds(){

    openPanel("Choose Background");

    for(let i=1;i<=21;i++){

        let img=document.createElement("img");

        img.src=
"/static/images/scrapbook/backgrounds/background"+i+".jpg";

        img.className="asset-item";

        img.onclick=function(){

            document.querySelectorAll(".asset-item")
            .forEach(x=>x.classList.remove("selected"));

            img.classList.add("selected");

            applyBackground(img.src);

        }

        assetContainer.appendChild(img);

    }

}

function applyBackground(src){

    canvas.style.backgroundImage="url('"+src+"')";

    canvas.style.backgroundSize="cover";

    canvas.style.backgroundPosition="center";

}

/* ==========================================================
      Photos
========================================================== */

function openPhotos(){

    photoPicker.click();

}

function uploadPhoto(e){

    const file=e.target.files[0];

    if(!file) return;

    let reader=new FileReader();

    reader.onload=function(ev){

        addPhoto(ev.target.result);

    }

    reader.readAsDataURL(file);

}

/* ==========================================================
      Create Box
========================================================== */

function createBox(){

    removePlaceholder();

    let box=document.createElement("div");

    box.className="canvas-box";

    box.style.width="180px";

    box.style.height="180px";

    box.style.left="80px";

    box.style.top="120px";

    box.style.zIndex=highestZ++;

    box.onclick=function(e){

        e.stopPropagation();

        selectBox(box);

    }

    canvas.appendChild(box);

    return box;

}
/* ==========================================================
      PART 2
      Stickers + Frames + Papers + Tape + Text
========================================================== */

/* ==========================================================
      Stickers
========================================================== */

function openStickers(){

    openPanel("Choose Sticker");

    assetContainer.innerHTML=`

<button class="category-btn"
onclick="loadStickerCategory('animals')">🐻 Animals</button>

<button class="category-btn"
onclick="loadStickerCategory('flowers')">🌸 Flowers</button>

<button class="category-btn"
onclick="loadStickerCategory('aesthetic')">✨ Aesthetic</button>

<button class="category-btn"
onclick="loadStickerCategory('food')">🍰 Food</button>

<button class="category-btn"
onclick="loadStickerCategory('study')">📚 Study</button>

<button class="category-btn"
onclick="loadStickerCategory('travel')">✈ Travel</button>

<button class="category-btn"
onclick="loadStickerCategory('emotions')">😊 Emotions</button>

`;

}

/* ==========================================================
      Sticker Category
========================================================== */

function loadStickerCategory(category){

    container.innerHTML = "";

    let total = 20;
    let prefix = category;

    // Animals folder मध्ये animal1.png आहे
    if(category === "animals"){
        total = 13;
        prefix = "animal";
    }

    // बाकी folders
    if(category === "flowers") total = 20;
    if(category === "food") total = 20;
    if(category === "study") total = 20;
    if(category === "travel") total = 20;
    if(category === "emotions") total = 20;
    if(category === "aesthetic") total = 20;

    for(let i=1; i<=total; i++){

        let img = document.createElement("img");

        img.src = `/static/images/stickers/${category}/${prefix}${i}.png`;

        img.className = "asset-item";

        img.onerror = function(){
            this.style.display = "none";
        };

        img.onclick = function(){
            addSticker(this.src);
            closePanel();
        };

        container.appendChild(img);
    }

}

/* ==========================================================
      Frames
========================================================== */

function openFrames(){

    showAssets("Frames","frame",23);

}

/* ==========================================================
      Papers
========================================================== */

function openPapers(){

    showAssets("Papers","paper",16);

}

/* ==========================================================
      Washi Tape
========================================================== */

function openTapes(){

    showAssets("Washi Tape","tape",20);

}

/* ==========================================================
      Generic Assets
========================================================== */

function showAssets(titleText,prefix,total){

    openPanel(titleText);

    for(let i=1;i<=total;i++){

        let img=document.createElement("img");

        img.src=
`/static/images/scrapbook/${prefix}s/${prefix}${i}.png`;

        img.className="asset-item";

        img.onclick=function(){

            addSticker(img.src);

        }

        assetContainer.appendChild(img);

    }

}

/* ==========================================================
      Sticker
========================================================== */

function addSticker(src){

    removePlaceholder();

    let box = createBox();

    let img = document.createElement("img");

    img.src = src;

    img.className = "canvas-sticker";

    box.appendChild(img);

    canvas.appendChild(box);   // ⭐ हे missing होतं

    selectBox(box);

}

/* ==========================================================
      Photo
========================================================== */

function addPhoto(src){

    let box=createBox();

    let img=document.createElement("img");

    img.src=src;

    img.className="canvas-photo";

    box.appendChild(img);

    selectBox(box);

}

/* ==========================================================
      Text
========================================================== */

function addText(){

    let box=createBox();

    box.style.width="220px";

    box.style.height="80px";

    let txt=document.createElement("textarea");

    txt.placeholder="Write your memory...";

    box.appendChild(txt);

    selectBox(box);

}
/* ==========================================================
      PART 3
      Selection + Drag + Resize + Controls
========================================================== */

/* ==========================================================
      Select Box
========================================================== */

function selectBox(box){

    document.querySelectorAll(".canvas-box").forEach(item=>{

        item.classList.remove("active");

        removeControls(item);

    });

    selectedBox=box;

    box.classList.add("active");

    createControls(box);

    bringToFront(box);

}

/* ==========================================================
      Bring To Front
========================================================== */

function bringToFront(box){

    box.style.zIndex=highestZ++;

}

/* ==========================================================
      Controls
========================================================== */

function createControls(box){

    removeControls(box);

    /* Delete */

    let del=document.createElement("button");

    del.className="delete-btn";

    del.innerHTML="🗑";

    del.onclick=function(e){

        e.stopPropagation();

        box.remove();

    };

    box.appendChild(del);

    /* Rotate */

    let rotate=document.createElement("button");

    rotate.className="rotate-btn";

    rotate.innerHTML="↻";

    rotate.onclick=function(e){

        e.stopPropagation();

        let angle=parseInt(box.dataset.rotate||0);

        angle+=15;

        box.dataset.rotate=angle;

        updateTransform(box);

    };

    box.appendChild(rotate);

    /* Flip */

    let flip=document.createElement("button");

    flip.className="flip-btn";

    flip.innerHTML="⇋";

    flip.onclick=function(e){

        e.stopPropagation();

        box.dataset.flip=
        box.dataset.flip==="yes"?"no":"yes";

        updateTransform(box);

    };

    box.appendChild(flip);

    /* Resize */

    let resize=document.createElement("div");

    resize.className="resize-handle";

    resize.onmousedown=function(e){

        resizeStart(e,box);

    };

    box.appendChild(resize);

    dragStart(box);

}

/* ==========================================================
      Remove Controls
========================================================== */

function removeControls(box){

    box.querySelectorAll(
        ".delete-btn, .rotate-btn, .flip-btn, .resize-handle"
    ).forEach(btn=>btn.remove());

}

/* ==========================================================
      Transform
========================================================== */

function updateTransform(box){

    let angle=parseInt(box.dataset.rotate||0);

    let flip=(box.dataset.flip==="yes")?-1:1;

    box.style.transform=
    `scaleX(${flip}) rotate(${angle}deg)`;

}

/* ==========================================================
      Drag
========================================================== */

function dragStart(box){

    box.onmousedown=function(e){

        if(

            e.target.classList.contains("resize-handle") ||

            e.target.classList.contains("delete-btn") ||

            e.target.classList.contains("rotate-btn") ||

            e.target.classList.contains("flip-btn")

        ) return;

        let startX=e.clientX;

        let startY=e.clientY;

        let left=box.offsetLeft;

        let top=box.offsetTop;

        document.onmousemove=function(ev){

            box.style.left=
            left+(ev.clientX-startX)+"px";

            box.style.top=
            top+(ev.clientY-startY)+"px";

        };

        document.onmouseup=function(){

            document.onmousemove=null;

            document.onmouseup=null;

        };

    };

}

/* ==========================================================
      Resize
========================================================== */

function resizeStart(e,box){

    e.stopPropagation();

    let startX=e.clientX;

    let startWidth=box.offsetWidth;

    let startHeight=box.offsetHeight;

    document.onmousemove=function(ev){

        let width=startWidth+(ev.clientX-startX);

        let height=startHeight+(ev.clientX-startX);

        if(width<60) width=60;

        if(height<60) height=60;

        box.style.width=width+"px";

        box.style.height=height+"px";

    };

    document.onmouseup=function(){

        document.onmousemove=null;

        document.onmouseup=null;

    };

}

/* ==========================================================
      Click Outside
========================================================== */

document.addEventListener("click",function(e){

    if(!e.target.closest(".canvas-box")){

        document.querySelectorAll(".canvas-box").forEach(item=>{

            item.classList.remove("active");

            removeControls(item);

        });

        selectedBox=null;

    }

});
/* ==========================================================
      PART 4
      Save + Keyboard + Touch + Final Functions
========================================================== */

/* ==========================================================
      Save
========================================================== */

if(saveButton){

    saveButton.onclick=function(){

        alert("💚 Scrapbook Saved Successfully!");

    };

}

/* ==========================================================
      Delete Key
========================================================== */

document.addEventListener("keydown",function(e){

    if(e.key==="Delete" && selectedBox){

        selectedBox.remove();

        selectedBox=null;

    }

});

/* ==========================================================
      ESC Close Panel
========================================================== */

document.addEventListener("keydown",function(e){

    if(e.key==="Escape"){

        closePanel();

    }

});

/* ==========================================================
      Touch Support
========================================================== */

document.querySelectorAll(".toolbar button").forEach(btn=>{

    btn.addEventListener("touchstart",function(){

        this.style.transform="scale(.95)";

    });

    btn.addEventListener("touchend",function(){

        this.style.transform="scale(1)";

    });

});

/* ==========================================================
      Background Selection Highlight
========================================================== */

document.addEventListener("click",function(e){

    if(e.target.classList.contains("asset-item")){

        document.querySelectorAll(".asset-item").forEach(item=>{

            item.classList.remove("selected");

        });

        e.target.classList.add("selected");

    }

});

/* ==========================================================
      Cover Photo Drag
========================================================== */

const cover=document.getElementById("coverPhoto");

if(cover){

    cover.onmousedown=function(e){

        let startX=e.clientX;

        let startY=e.clientY;

        let left=cover.offsetLeft;

        let top=cover.offsetTop;

        document.onmousemove=function(ev){

            cover.style.position="absolute";

            cover.style.left=
            left+(ev.clientX-startX)+"px";

            cover.style.top=
            top+(ev.clientY-startY)+"px";

        };

        document.onmouseup=function(){

            document.onmousemove=null;

            document.onmouseup=null;

        };

    };

}

/* ==========================================================
      Double Click -> Bring Front
========================================================== */

canvas.addEventListener("dblclick",function(e){

    let box=e.target.closest(".canvas-box");

    if(box){

        bringToFront(box);

    }

});

/* ==========================================================
      Close Panel After Adding Item
========================================================== */

function autoClosePanel(){

    setTimeout(function(){

        closePanel();

    },300);

}
/* ==========================================================
      PART 5
      Final Initialization + Helpers
========================================================== */

/* ==========================================
      Auto Close Panel
========================================== */

function finishAdding(){

    autoClosePanel();

}

/* ==========================================
      Click Sticker
========================================== */

document.addEventListener("click",function(e){

    if(e.target.classList.contains("asset-item")){

        finishAdding();

    }

});

/* ==========================================
      Canvas Click
========================================== */

canvas.addEventListener("click",function(e){

    if(e.target===canvas){

        selectedBox=null;

        document.querySelectorAll(".canvas-box").forEach(item=>{

            item.classList.remove("active");

            removeControls(item);

        });

    }

});

/* ==========================================
      Prevent Image Drag
========================================== */

document.addEventListener("dragstart",function(e){

    e.preventDefault();

});

/* ==========================================
      Save (Demo)
========================================== */

function saveScrapbook(){

    alert("💚 MemoryVerse Scrapbook Saved Successfully!");

}

if(saveButton){

    saveButton.onclick=saveScrapbook;

}

/* ==========================================
      Welcome
========================================== */

console.log("MemoryVerse Scrapbook Editor Loaded Successfully 💚");

