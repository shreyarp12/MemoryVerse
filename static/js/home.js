// Greeting

let hour = new Date().getHours();

let greeting = document.getElementById("greeting");

if(hour < 12){

    greeting.innerHTML = "Good Morning ☀️";

}

else if(hour < 17){

    greeting.innerHTML = "Good Afternoon 🌸";

}

else{

    greeting.innerHTML = "Good Evening 🌙";

}


// Quotes

const quotes=[

"Capture today, treasure tomorrow.",

"Small memories become life's biggest treasures.",

"Believe in yourself every day.",

"Every memory is worth keeping.",

"Smile today because tomorrow becomes a memory.",

"Your story matters.",

"Dream big, write often.",

"Happiness grows when memories are shared."

];

document.getElementById("quoteText").innerHTML = quotes[Math.floor(Math.random()*quotes.length)];