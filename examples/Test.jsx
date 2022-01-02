//# has-script
//# skip_to,5
import { useState } from "react";

function Test() {
    const [val, setVal] = useState(1);

    return (
        <div>
            <p>Hello World!</p>
            <p>{val}</p>
            <button
                type="button"
                onClick={() => setVal(val + 1)}
            >
                Click
            </button>
        </div>
    );
}

export default Test;

//# replace,6
const [val, setVal] = useState(2);
