import React from "react";
import PropTypes from "prop-types";
import { Input } from "antd";
import TaskActions from "../data/TaskActions";
import Dispatcher from "../data/dispatcher";

class Task extends React.PureComponent {

    constructor(props) {
        super(props);
        this.onFocus = this.onFocus.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.inputRef = React.createRef();
    }

    onFocus() {
        Dispatcher.dispatch({
            type: TaskActions.FOCUS,
            id: this.props.task.id,
        });
    }

    onChange(e) {
        const { value } = e.target;
        const {
            task,
        } = this.props;
        Dispatcher.dispatch({
            type: TaskActions.RENAME,
            id: task.id,
            name: value,
        });
    }

    onKeyDown(e) {
        const {
            key,
            ctrlKey,
            shiftKey,
        } = e;
        switch (key) { // eslint-disable-line default-case
            case "Enter":
                // add a new item, before if the cursor is at the beginning, after otherwise
                break;
            case "Backspace":
            case "Delete":
                // if the value is empty, delete the task
                break;
            case "Tab":
                // suppress the event (eventually nest)
                e.preventDefault();
                break;
            case "ArrowUp":
                e.preventDefault();
                if (shiftKey && ctrlKey) {
                    // ignore!
                } else if (shiftKey) {
                    // select this task and the previous one
                } else if (ctrlKey) {
                    // move all selected tasks up one (if a predecessor exists)
                } else {
                    Dispatcher.dispatch({
                        type: TaskActions.FOCUS_PREVIOUS,
                        id: this.props.task.id,
                    });
                }
                break;
            case "ArrowDown":
                e.preventDefault();
                if (shiftKey && ctrlKey) {
                    // ignore!
                } else if (shiftKey) {
                    // select this task and the next one
                } else if (ctrlKey) {
                    // move all selected tasks down one (if a follower exists)
                } else {
                    Dispatcher.dispatch({
                        type: TaskActions.FOCUS_NEXT,
                        id: this.props.task.id,
                    });
                }
                break;
        }
    }

    componentDidMount() {
        if (this.props.active) this.inputRef.current.focus();
    }

    componentDidUpdate() {
        if (this.props.active) this.inputRef.current.focus();
    }

    render() {
        const {
            task,
        } = this.props;
        return <div>
            <Input value={task.name}
                   ref={this.inputRef}
                   onFocus={this.onFocus}
                   onChange={this.onChange}
                   onKeyDown={this.onKeyDown}
            />
        </div>;
    }



}

Task.propTypes = {
    task: PropTypes.object.isRequired,
    active: PropTypes.bool.isRequired,
};

export default Task;