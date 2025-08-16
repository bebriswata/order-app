import React, { useState } from 'react'
import AuthForm from './components/AuthForm'
import OrderForm from './components/OrderForm'

function App() {
  const [token, setToken] = useState('')

  if (!token) {
    return <AuthForm onAuth={setToken} />
  }

  return <OrderForm token={token} />
}

export default App