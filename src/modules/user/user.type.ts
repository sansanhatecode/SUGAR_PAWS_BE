import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class UserType {
  @Field(() => Int)
  id: number;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  role: string;

  @Field()
  isVerified: boolean;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  gender?: string;

  @Field({ nullable: true })
  dayOfBirth?: number;

  @Field({ nullable: true })
  monthOfBirth?: number;

  @Field({ nullable: true })
  yearOfBirth?: number;
}
