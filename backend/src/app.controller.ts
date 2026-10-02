import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      name: 'TMS Backend API',
      status: 'ok',
      message: 'Backend đang hoạt động',
      endpoints: {
        login: 'POST /auth/login',
        currentUser: 'GET /auth/me',
        currentSession: 'GET /auth/session',
        logout: 'POST /auth/logout',
      },
    };
  }
}
