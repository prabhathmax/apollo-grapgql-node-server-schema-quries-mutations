import bcrypt from 'bcrypt';

const profileForAccount = async (knex, userId) => {
    return knex('profiles').select([
        'userId',
        'firstName',
        'lastName',
        'middleName',
        'createdAt',
        'updatedAt',
    ])
        .where({ userId })
        .first();
};

class AccountRepository{
    constructor(kenx) {
        this.database = kenx;
        this.accountColumns = [
            'userId',
            'email',
            'resetToken',
            'createdAt',
            'updatedAt',
        ];
    }

    async add(info) {
        let userId;
        const now = new Date();
        const saltRounds = 3;
        let password;
        await bcrypt.hash(info.password, saltRounds, function(err, hash) {
            password = hash;
            console.log(hash)
        });
        await this.database.transaction( async trx => {
            const account = await this.database('accounts')
                .insert({
                    email: info.email,
                    password: password,
                    createdAt: now,
                    updatedAt: now,
                })
                .transacting(trx);
            await this.database('profiles')
                .insert({
                    userId: account[0],
                    firstName: info.firstName,
                    lastName: info.lastName,
                    middleName: info.middleName,
                    createdAt: now,
                    updatedAt: now,
                })
                .transacting(trx);
            await trx.commit();
            userId = account[0];
        });
        return this.findAccountById(userId);
    }

    async findAccountById(userId) {
        const account = await this.database('accounts')
            .select(this.accountColumns)
            .where(userId)
            .first();
        return {
            ...account,
            profile: await profileForAccount(this.database, userId),
        }
    }

    async all() {
        return this.database('accounts')
            .select(this.accountColumns);
    }

    async profile(userId) {
        return profileForAccount(this.database, userId);
    }
}

export default AccountRepository;