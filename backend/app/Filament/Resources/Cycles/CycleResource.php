<?php

namespace App\Filament\Resources\Cycles;

use App\Filament\Resources\Cycles\Pages\CreateCycle;
use App\Filament\Resources\Cycles\Pages\EditCycle;
use App\Filament\Resources\Cycles\Pages\ListCycles;
use App\Filament\Resources\Cycles\Schemas\CycleForm;
use App\Filament\Resources\Cycles\Tables\CyclesTable;
use App\Models\Cycle;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class CycleResource extends Resource
{
    protected static ?string $model = Cycle::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Schema $schema): Schema
    {
        return CycleForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CyclesTable::configure($table);
    }

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        return parent::getEloquentQuery()->with(['org']);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCycles::route('/'),
            'create' => CreateCycle::route('/create'),
            'edit' => EditCycle::route('/{record}/edit'),
        ];
    }
}
