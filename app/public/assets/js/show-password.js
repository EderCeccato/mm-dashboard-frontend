
"use strict"

// for show password
let createpassword = (type, ele) => {
    document.getElementById(type).type = document.getElementById(type).type == "password" ? "text" : "password"
    let icon = ele.querySelector('i').classList
    if (icon.contains("ri-eye-off-line")) {
        icon.remove("ri-eye-off-line")
        icon.add("ri-eye-line")
    }
    else {
        icon.remove("ri-eye-line")
        icon.add("ri-eye-off-line")
    }
}
