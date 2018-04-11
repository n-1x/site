function decodeURIParams() {
    const url = window.location.href
    let params = url.split('?')
    let obj = {}

    if (params[1]) {
        params = params[1].split('=')
    }

    for (param of params) {
        obj[params[0]] = params[1]
    }

    return obj
}


function renderPostList() {
    fetch("resources/postsList.json").then(a => {
        return a.json()
    }).then(data => {
        for(post of data.posts) {
            renderListEntry(post)
        }

        document.getElementById("postTemplate").remove()

        //after all the content has been created, call the loaded
        //function to fade in each element
        loaded()
    })
}


//Maybe render the posts in the same way that cards are rendered
//for project lists
function renderListEntry(post) {
    const a = document.createElement("a")
    const li = document.getElementById("postTemplate").cloneNode(true)
   
    //TODO: Load the same page for every block post, but include the link
    //to the html for the actual post
    //a.href = ``

    li.childNodes[1].innerText = post.title
    li.childNodes[3].innerText = post.desc

    //a.appendChild(li)
    document.getElementById("postList").appendChild(li)
}


function renderPost(postLink) {
    fetch(`blogPosts/${postLink}.html`).then(data => {
        return data.text()
    }).then(text => {
        const blog = document.getElementById("blog")

        document.getElementById("blog").innerHTML = text

        loaded()
    }).catch(error => {
        document.getElementById("blog").innerHTML = "Error 404: Post not found. <a href=\"blog.html\">Go back</a>"

        loaded()
    })
}


function main() {
    const params = decodeURIParams()

    if (params.postLink) {
        renderPost(params.postLink)
    } else {
        renderPostList()
    }

}


//set the blog posts to be loaded as soon as the DOM content is loaded
//maybe already load the postList.json file by here
document.addEventListener("DOMContentLoaded", main)