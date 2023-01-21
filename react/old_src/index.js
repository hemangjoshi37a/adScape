import React from 'react'
import ReactDOM from 'react-dom'

import { LoginPage, SignupPage } from './App'

const root = document.getElementById('root')
ReactDOM.render(
  <>
    <LoginPage />
    <SignupPage />
  </>,
  root,
)
