//# has-script
//# add_sub;Let's start by importing useState from React, and create a function called Incremental Click
import { useState } from "react";

function IncrementalClick() {
    //# add_sub;Then instanciate a local variable, and it's setter with useState.
    const [val, setVal] = useState(0);
    //# add_sub;This is the value that it will be displayed on the page and incremented on click.

    //# add_sub;This function will return a JSX wrapped on a "deev".
    return (
        <div>
            <p>{val}</p>
            //# add_sub;Create a button to be clicked
            <button
                type="button"
                //# add_sub;And everytime this button is clicked, increments the variable "val".
                onClick={() => setVal(val + 1)}
            >
                Click
                //# add_sub;Now just close everything
            </button>
        </div>
    );
}

//# add_sub;And export the function so other components can use it.
export default IncrementalClick;
