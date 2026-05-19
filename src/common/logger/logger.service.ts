import {
 Injectable
} from '@nestjs/common';

import {
 PinoLogger
} from 'nestjs-pino';

@Injectable()

export class AppLogger {

 constructor(
   private readonly logger:
   PinoLogger
 ) {}

 info(
   context:string,
   message:string,
   meta?:object
 ){

   this.logger.setContext(
     context
   );

   this.logger.info(
     meta ?? {},
     message
   );

 }

 warn(
   context:string,
   message:string,
   meta?:object
 ){

   this.logger.setContext(
     context
   );

   this.logger.warn(
     meta ?? {},
     message
   );

 }

 error(
   context:string,
   message:string,
   error?:unknown
 ){

   this.logger.setContext(
     context
   );

   this.logger.error(
     { error },
     message
   );

 }

}