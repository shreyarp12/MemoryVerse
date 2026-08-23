// Show / Hide Password

function togglePassword(){

    let password=document.getElementById("password");

    let confirm=document.getElementById("confirm_password");

    if(password.type==="password"){

        password.type="text";

        confirm.type="text";

    }

    else{

        password.type="password";

        confirm.type="password";

    }

}



// Avatar Slider Left

function scrollLeftAvatar(){

    document.getElementById("avatarContainer").scrollBy({

        left:-180,

        behavior:"smooth"

    });

}



// Avatar Slider Right

function scrollRightAvatar(){

    document.getElementById("avatarContainer").scrollBy({

        left:180,

        behavior:"smooth"

    });

}