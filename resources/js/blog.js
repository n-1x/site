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
    fetch("resources/postList.json").then(a => {
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

/**************************************************************************************************************** */
//Maybe render the posts in the same way that cards are rendered
//for project lists
function renderListEntry(post) {
    const a = document.createElement("a")
    const li = document.getElementById("postTemplate").cloneNode(true)
    const postList = document.getElementById("postList")

    //a.href = ``

    li.childNodes[1].innerText = post.title
    li.childNodes[3].innerText = post.desc

    //a.appendChild(li)
    postList.appendChild(li)

    li.addEventListener("click", () => {
        history.pushState({urlPath: "blog.html"}, "", `blog.html?link=${post.link}`)
        postList.remove()
        renderPost(post)
    })
}


function renderPost(post) {
    fetch(`blogPosts/${post.link}.html`).then(data => {
        return data.text()
    }).then(text => {
        const blog = document.getElementById("blog")
        const blogPost = document.createElement("div")
        const title = document.createElement("h2")

        blogPost.id = "blogPost"

        title.innerText = post.title

        blogPost.appendChild(title)
        blogPost.innerHTML += text

        blog.appendChild(blogPost)
    }).catch(error => {
        document.getElementById("blog").innerHTML = "Error 404: Post not found.<br/><a href=\"blog.html\">Go back</a>"
    })
}


function main() {
    const params = decodeURIParams()

    //if there's no "link=<>" in the uri, then just
    //render the list of posts, else render the linked
    //post
    if (params.link) {
        document.getElementById("postList").remove()
        //fetch the postlist and find the post to be loaded
        //this means renderPost can be called with the full post
        //information which is needed for creating the title
        fetch("resources/postList.json").then(data => {
            return data.json()
        }).then(json => {
            for (post of json.posts) {
                if (post.link == params.link) {
                    renderPost(post)
                    loaded()
                    break
                }
            }
        })
    }
    else {
        renderPostList()
    }
}


//if the user pressed the back button but is still on this page
//then they expect to go back to the list of blog posts. This 
//is because when you choose a blog post pushState is called with
//a link to this page. So if this event happens, just refresh and they
//will be shown the post list again
window.addEventListener("popstate", () => {
    location.reload()
})


//set the blog posts to be loaded as soon as the DOM content is loaded
//maybe already load the postList.json file by here
document.addEventListener("DOMContentLoaded", main)