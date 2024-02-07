import { sql } from '@vercel/postgres'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { json } from '@sveltejs/kit'

export async function POST({ request }) {
	const { email, password } = await request.json()

	try {
		const result = await sql`SELECT * FROM accounts WHERE email = ${email}`
		const user = result.rows[0]

		if (!user) {
			return json({ error: '사용자를 찾을 수 없습니다.' }, { status: 401 })
		}

		const match = await bcrypt.compare(password, user.password)

		if (!match) {
			return json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 })
		}

		const accessToken = jwt.sign(
			{ id: user.id, role: user.role, username: user.username, email: user.email },
			import.meta.env.VITE_APP_JWT_SECRET,
			{
				expiresIn: '1h'
			}
		)
		const refreshToken = jwt.sign(
			{ id: user.id, role: user.role, username: user.username, email: user.email },
			import.meta.env.VITE_APP_JWT_REFRESH_SECRET_KEY,
			{
				expiresIn: '7d'
			}
		)

		return json(
			{ accessToken: accessToken, refreshToken: refreshToken, message: 'success' },
			{ status: 200 }
		)
	} catch (err) {
		return json({ error: '서버 에러' }, { status: 500 })
	}
}
