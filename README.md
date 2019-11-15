# vuese-vuex


Friendly addon to [@vuese](https://github.com/shuidi-fed/vuese) to allow it to work with a Vuex store file.

This code was originally a [PR to @vuese](https://github.com/shuidi-fed/vuese/pull/103), but it was determined that Vuex Store was out of scope for @vuese. This addon will gladly be merged with @vuese if the maintainers wish.

# Installation

```
npm i vuese-vuex -D
```


#Usage

Vuese-vuex must be run after vuese has already generated the index.html file for the documentation website. It updates the sidebar with the link to the store.js doc file.

```
vuese gen && vuese-vuex gen
```

Getters, Actions, and Mutations follow the same rules for methods in a component. (Must be marked with a `@vuese` comment).


# Example

```
//store.js

export default {
    getters: {
        // @vuese
        // Getter used for testing
        testGetter() {

        }
    },
    actions: {
        // @vuese
        // The number one action for the project
        // @arg The first
        // @arg The second
        myNumberOneAction(arg1, arg2) {

        }
    },
    mutations: {
        // @vuese
        // My only mutation
        // @arg The value to set
        CHANGE_THE_STATE(value) {
        }
    },
    state: {
        // @vuese
        // used for determining if someone can use perms
        permissions: {}
    }
}
```
