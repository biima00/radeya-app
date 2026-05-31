<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required(),
                DateTimePicker::make('email_verified_at'),
                TextInput::make('password')
                    ->password()
                    ->required(fn (string $context): bool => $context === 'create')
                    ->dehydrated(fn ($state) => filled($state))
                    ->rule(\Illuminate\Validation\Rules\Password::min(8)->letters()->numbers()),
                Select::make('role')
                    ->options([
                        'MEMBER' => 'Member',
                        'ADMIN' => 'Admin',
                    ])
                    ->default('MEMBER')
                    ->required(),
                Select::make('org_id')
                    ->relationship('org', 'name')
                    ->required(),
            ]);
    }
}
