import React, { Component } from "react"
import ResizeMoveFrame from "./frame"
import get from "lodash.get"

export default function asSelectable(WrappedComponent) {
  class InjectSelectable extends Component {
    static WrappedComponent = WrappedComponent

    handleShapeSelected = () => {
      const { shape, onChange } = this.props
      onChange(shape)
    }

    get isShapeSelected() {
      return this.props.selectable &&
        get(this.props, "selectedShape.id", -1) === this.props.shape.id
    }

    render() {
      const { zoom, dpi, shape, selectable, onChange } = this.props
      const wrappedProps = { zoom, dpi, shape }

      /**
       * Since text boxes can have input we need extra props
       * to handle their state and change events.
       */
      if (shape.type === "text") {
        wrappedProps.onChange = onChange
        wrappedProps.isEditing = this.props.isEditing
      }

      return (
        <g
          onClick={selectable ? this.handleShapeSelected : null}
        >
          <WrappedComponent {...wrappedProps} />
          {this.isShapeSelected && <ResizeMoveFrame {...this.props} />}
        </g>
      )
    }
  }
  return InjectSelectable
}
