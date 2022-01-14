//# has-script
//# speak;Let's start by importing useState from React, and create a function called Incremental Click
import { useState } from "react";

function IncrementalClick() {
    //# speak;Then instanciate a local variable, and it's setter with useState.
    //# speak;This is the value that it will be displayed on the page and incremented on click.
    const [val, setVal] = useState(0);

    //# speak;This function will return a JSX wrapped on a "deev".
    return (
        <div>
            <p>{val}</p>
            //# speak;Create a button to be clicked
            <button
                type="button"
                //# speak;And everytime this button is clicked, increments the variable "val".
                onClick={() => setVal(val + 1)}
            >
                Click
                //# speak;Now just close everything
            </button>
        </div>
    );
}

//# speak;And export the function so other components can use it.
export default IncrementalClick;
