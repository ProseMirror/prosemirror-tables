import {initialize, schema} from './demo.base'
import {DOMParser} from "prosemirror-model";

let doc = DOMParser.fromSchema(schema).parse(document.querySelector("#content"))

initialize(doc)