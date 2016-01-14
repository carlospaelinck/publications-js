import React, {Component, PropTypes, addons} from 'react'
import InputText from '../ui/input.text'

export default class UserAccountModal extends Component {
  constructor() {
    super(...arguments)
    this.state = {name: '', password: '', currrentPassword: '', temporary: false}
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      temporary: nextProps.isTemporaryUser,
      name: nextProps.isTemporaryUser ? '' : nextProps.userName
    })

    if (this.props.isPatchingUser &&
        !nextProps.isPatchingUser &&
        !nextProps.failedUpdate) {
      this.dismiss()
    }

    if (nextProps.failedUpdate) {
      this.setState({password: '', currrentPassword: ''})
    }
  }

  render() {
    const {temporary} = this.state

    const emailField = temporary ? <InputText
      displayName="Email Address"
      name="name"
      theme="light"
      validator='isLength'
      validatorOptions={1}
      value={this.state.name}
      valueChanged={::this.formValueChanged}
    /> : null

    const currentPasswordField = !temporary ? <InputText
      displayName="Current Password"
      name="currentPassword"
      theme="light"
      value={this.state.currentPassword}
      valueChanged={::this.formValueChanged}
    /> : null

    const headerText = temporary ? 'Create Account' : 'Change Password'
    const {failedUpdate, isPatchingUser} = this.props

    const descriptionText = (temporary, failedUpdate, name = null) => {
      if (temporary && !failedUpdate) {
        return 'Create a free Publications account'
      } else if (temporary && failedUpdate) {
        return 'There was an error creating your account. Verify the email is not already in use and try again.'
      } else if (!temporary && !failedUpdate) {
        return `Update password for ${name}.`
      } else if (!temporary && failedUpdate) {
        return 'There was an error updating your account. Verify the passwords are correct and try again.'
      }
    }

    if (this.props.isOpen) {
      return (
        <div className="modal-cover">
          <div className="modal modal-new-document">
            <div className="modal-content">
              <div className="modal-header">
                <h1>{headerText}</h1>
                <h3>{descriptionText(temporary, failedUpdate, this.state.name)}</h3>
              </div>
              <div className="modal-inner-content">
                <form onSubmit={::this.handleSubmit}>
                  {emailField}
                  {currentPasswordField}
                  <InputText
                    displayName="New Password"
                    name="password"
                    theme="light"
                    value={this.state.password}
                    valueChanged={::this.formValueChanged}
                  />
                  <div className="modal-form-buttons">
                    <button disabled={isPatchingUser} className="button button-full" type="submit">
                      {temporary ? 'Create Account' : 'Update'}
                    </button>
                    <button disabled={isPatchingUser} className="button button-full" type="button" onClick={::this.dismiss}>
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return (<div/>)
    }
  }

  formValueChanged(event) {
    this.state[event.target.name] = event.target.value
    this.setState(this.state)
  }

  dismiss() {
    let clearState = {currentPassword: '', password: ''}

    if (this.state.temporary) {
      clearState.name = ''
    }

    this.setState(clearState)
    this.props.cancelUpdateUser()
    this.props.toggleModal()
  }

  handleSubmit(event) {
    event.preventDefault()

    const {currentPassword, password} = this.state
    let updateJson = {password}

    if (this.state.temporary) {
      updateJson.name = this.state.name
      updateJson.currentPassword = 'password'
      updateJson.temporary = false
    } else {
      updateJson.currentPassword = currentPassword
    }

    this.props.updateUser(updateJson)
  }
}