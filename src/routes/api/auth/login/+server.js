import { sql } from '@vercel/postgres'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { json } from '@sveltejs/kit'

export async function POST({ request }) {
	// 로그인 API
	const { email, password } = await request.json()

	try {
		const result = await sql`SELECT * FROM accounts WHERE email = ${email}`
		const user = result.rows[0]

		if (!user) {
			throw { status: 404, message: '사용자를 찾을 수 없습니다.' }
		}

		const match = await bcrypt.compare(password, user.password)

		if (!match) {
			throw { status: 400, message: '비밀번호가 일치하지 않습니다.' }
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

		let userRole
		if (user.role === 1) {
			userRole = '최고 관리자'
		} else if (user.role === 2) {
			userRole = '일반 관리자'
		} else if (user.role === 3) {
			userRole = '최고 운영자'
		} else if (user.role === 4) {
			userRole = '일반 운영자'
		}

		return json(
			{
				username: user.username,
				role: userRole,
				accessToken: accessToken,
				refreshToken: refreshToken,
				message: '로그인 성공',
				status: 200
			},
			{ status: 200 }
		)
	} catch (err) {
		console.error(err)
		return json(
			{
				message: `${err.message}`,
				status: err.status || 400
			},
			{ status: err.status || 500 }
		)
	}
}
