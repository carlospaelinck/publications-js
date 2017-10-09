import React, { Component } from "react"
import PropTypes from "prop-types";
import { connect } from "react-redux"
import {
  fetchCurrentUser, currentUserSelector, logOut, fetchUser
} from "../../modules/session"

class IndexView extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  componentWillMount() {
    this.props.fetchCurrentUser()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.user) {
      this.context.router.history.replace("/documents")
    }
  }

  render() {
    return (
      <div>
        <h2>Index View</h2>
        <button
          onClick={() => this.props.fetchUser({
            emailAddress: "carlos@email.com",
            password: "carlos13"
          })}
        >
          Log In
        </button>
        <button
          onClick={() => this.props.logOut()}
        >
          Log Out
        </button>
        {JSON.stringify(this.props.user)}
      </div>
    )
  }
}

export default connect(
  state => ({
    user: currentUserSelector(state)
  }), {
    fetchUser,
    fetchCurrentUser,
    logOut
  })(IndexView)
