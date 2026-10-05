import { Global, Module } from '@nestjs/common';
import { SessionRegistry } from './session-registry.service';

@Global()
@Module({
  providers: [SessionRegistry],
  exports: [SessionRegistry],
})
export class SessionsModule {}
