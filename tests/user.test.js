const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, setupDatabase } = require('./fixtures/db')

beforeEach( setupDatabase )

test('Should signup a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Regis',
        email: 'regis@example.com',
        password: 'MyPass777!'
    }).expect(201)

    // Assert that the db was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertions about the response
    expect(response.body).toMatchObject({
        user: {
                name: 'Regis',
                email: 'regis@example.com'
            },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('MyPass777!')
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should NOT login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: 'wrongPass'
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should NOT get porfile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should NOT delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

        const user = await User.findById(userOneId)
        expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Regis'
        })
        .expect(200)

        const user = await User.findById(userOneId)
        expect(user.name).toEqual('Regis')
})

test('Should NOT udpate invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'New York'
        })
        .expect(400)
})


// Should not signup user with invalid name/email/password
test('Should not signup user with invalid name', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: { foo: 'bar'},
            email: 'someone@example.com',
            password: 'someValidPass123!!'
        })
        .expect(400)
})

test('Should not signup user with invalid email', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: 'John Doe',
            email: 'invalid@',
            password: 'someValidPass123'
        })
        .expect(400)
})

test('Should not signup user with invalid password: too short', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: '123'
        })
        .expect(400)
})

test('Should not signup user with invalid password: contains \'password\'', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: 'myInvalidPassword123'
        })
        .expect(400)
})

// Should not update user if unauthenticated
test('Should not update user if unauthenticated', async () => {
    await request(app)
        .patch('/users/me')
        .send({
            name: 'Joe Doe'
        })
        .expect(401)
})

// Should not update user with invalid name/email/password
test('Should not update user with invalid name', async () => {
    const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: { foo: 'bar' }
        })
        .expect(400)
})

// Should not delete user if unauthenticated
test('Should not delete user if unauthenticated', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})