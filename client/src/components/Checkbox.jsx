import * as React from "react";
import { Checkbox, Form } from "radix-ui"
import { CheckIcon } from "@radix-ui/react-icons"
import "./Checkbox.css"

const MyCheckbox = ({ checked, onCheckedChange }) => (
	<div style={{ display: "flex", alignItems: "center" }}>
		<Checkbox.Root className="CheckboxRoot" checked={checked} onCheckedChange={onCheckedChange} id="c1">
			<Checkbox.Indicator className="CheckboxIndicator">
				<CheckIcon />
			</Checkbox.Indicator>
		</Checkbox.Root>
		<label className="Label" htmlFor="c1">
			Remember Me
		</label>
	</div>
)

export default MyCheckbox